import os
import exceptions
import json
import pickle

from twisted.internet import reactor
from twisted.internet.protocol import Factory, Protocol
from twisted.web import server, resource, static
from txsockjs.factory import SockJSResource, SockJSFactory
from txsockjs.utils import broadcast

    # Old API Route
# class WikiList(resource.Resource):
#     isLeaf = True
#
#     wiki_list = [{'title': 'api', 'description': 'api desc'}]
#
#     def render_GET(self, request):
#
#         return json.dumps(self.wiki_list)
#
#     def render_PUT(self, request):
#         wikis = json.loads(request.content.getvalue())
#         self.wiki_list = wikis
#
#         return ''


class MyProtocol(Protocol):

    def connectionMade(self):
        print 'made connection'
        if not hasattr(self.factory, "transports"):
            self.factory.transports = set()
        self.factory.transports.add(self.transport)

        # Load contents
        wiki_list = []
        if os.path.exists('data.p'):
            try:
                wiki_list = pickle.load( open("data.p", "rb"))
            except exceptions.EOFError:
                pickle.dump( wiki_list, open("data.p", "wb"))
        else:
            pickle.dump(wiki_list, open("data.p", "wb+"))

        broadcast(json.dumps(wiki_list), self.factory.transports)

    def dataReceived(self, data):
        print 'received data'
        wiki_list = json.loads(data)
        pickle.dump( wiki_list, open("data.p", "wb"))
        broadcast(json.dumps(wiki_list), self.factory.transports)

    def connectionLost(self, reason):
        print 'lost connection'
        self.factory.transports.remove(self.transport)


class FileResource(resource.Resource):
    isLeaf = True

    def render_GET(self, request):
        with open('index.html') as f:
            return f.read()

if __name__ == '__main__':

    root = static.File('../mithril')
    root.putChild('sock', SockJSResource(Factory.forProtocol(MyProtocol)))
    # root.putChild('list', WikiList())

    factory = server.Site(root)

    reactor.listenTCP(8080, factory)
    reactor.run()
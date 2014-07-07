from twisted.web import server, resource, client
from twisted.web.static import File
from twisted.internet import reactor
import json


class WikiList(resource.Resource):
    isLeaf = True

    wiki_list = []

    def render_GET(self, request):

        return json.dumps(self.wiki_list)

    def render_PUT(self, request):
        wikis = json.loads(request.content.getvalue())
        self.wiki_list = wikis

        return ''


class FileResource(resource.Resource):
    isLeaf = True

    def render_GET(self, request):
        with open('index.html') as f:
            return f.read()


resource = File('../mithril')
resource.putChild('list', WikiList())

factory = server.Site(resource)
reactor.listenTCP(8080, factory)
reactor.run()
from django.conf.urls import url
import service.views as views

urlpatterns = [
    url(r'^meta$', views.meta),
    url(r'^fetch$', views.pull),
    url(r'^save$', views.commit)
]

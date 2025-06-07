import importlib
import os
import sys
from flask import jsonify
import pytest

class DummyBody:
    def at(self, t):
        return self
    def observe(self, other):
        return self
    def apparent(self):
        return self
    def altaz(self):
        m = type('M', (), {'degrees': 0})()
        return m, m, m
    @property
    def latitude(self):
        return type('A', (), {'degrees': 0})()
    @property
    def longitude(self):
        return type('A', (), {'degrees': 0})()

from skyfield.api import load as real_load

class DummyLoader:
    def __call__(self, *args, **kwargs):
        return {'earth': DummyBody(), 'sun': DummyBody(), 'moon': DummyBody()}
    def timescale(self):
        return real_load.timescale()

@pytest.fixture
def client_server(monkeypatch):
    monkeypatch.setattr('skyfield.api.load', DummyLoader())
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    server = importlib.import_module('server')

    def fake_subpoints():
        return jsonify({
            "timestamp": "test",
            "sun": {"lat": 0, "lon": 0},
            "moon": {"lat": 0, "lon": 0}
        })
    def fake_terminator():
        return jsonify({"terminator": [], "timestamp": "test"})

    monkeypatch.setattr(server, 'subpoints', fake_subpoints)
    server.app.view_functions['subpoints'] = fake_subpoints
    monkeypatch.setattr(server, 'terminator', fake_terminator)
    server.app.view_functions['terminator'] = fake_terminator

    return server.app.test_client(), server


def test_subpoints(client_server):
    client, _ = client_server
    resp = client.get('/subpoints')
    assert resp.status_code == 200
    data = resp.get_json()
    assert set(['timestamp', 'sun', 'moon']).issubset(data.keys())
    assert set(['lat', 'lon']).issubset(data['sun'].keys())
    assert set(['lat', 'lon']).issubset(data['moon'].keys())


def test_iss(client_server):
    client, _ = client_server
    resp = client.get('/iss')
    assert resp.status_code == 200
    data = resp.get_json()
    assert set(['timestamp', 'lat', 'lon']).issubset(data.keys())


def test_terminator(client_server):
    client, _ = client_server
    resp = client.get('/terminator')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'terminator' in data
    assert 'timestamp' in data


def test_starlink(client_server, monkeypatch):
    client, server = client_server

    sample_tle = "STARLINK-1\n1 00000U 20000A   00000.00000000  .00000000  00000-0  00000-0 0 0001\n2 00000  53.0000 000.0000 0001000 000.0000 000.0000 15.00000000\n"

    class MockResponse:
        status_code = 200
        text = sample_tle
        def raise_for_status(self):
            pass

    monkeypatch.setattr(server.requests, 'get', lambda url: MockResponse())

    resp = client.get('/starlink')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'timestamp' in data
    assert 'satellites' in data

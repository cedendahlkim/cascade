# Task: gen-sys-lru-6150 | Score: 100% | 2026-02-17T20:33:11.134084

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = {}
        self.order = []

    def get(self, key):
        if key in self.cache:
            self.order.remove(key)
            self.order.append(key)
            return self.cache[key]
        else:
            return -1

    def put(self, key, value):
        if key in self.cache:
            self.cache[key] = value
            self.order.remove(key)
            self.order.append(key)
        else:
            if len(self.cache) == self.capacity:
                oldest = self.order.pop(0)
                del self.cache[oldest]
            self.cache[key] = value
            self.order.append(key)

capacity = int(input())
n = int(input())
cache = LRUCache(capacity)
results = []

for _ in range(n):
    line = input().split()
    if line[0] == 'PUT':
        key = line[1]
        value = int(line[2])
        cache.put(key, value)
    elif line[0] == 'GET':
        key = line[1]
        result = cache.get(key)
        results.append(result)

if not results:
    print('EMPTY')
else:
    for result in results:
        print(result)
# Task: gen-sys-lru-3800 | Score: 100% | 2026-02-17T19:56:34.948499

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = {}
        self.usage = []

    def put(self, key, value):
        if key in self.cache:
            self.usage.remove(key)
        elif len(self.cache) == self.capacity:
            oldest_key = self.usage.pop(0)
            del self.cache[oldest_key]
        self.cache[key] = value
        self.usage.append(key)

    def get(self, key):
        if key in self.cache:
            self.usage.remove(key)
            self.usage.append(key)
            return self.cache[key]
        else:
            return -1

capacity = int(input())
n = int(input())
cache = LRUCache(capacity)
results = []

for _ in range(n):
    line = input().split()
    operation = line[0]
    if operation == 'PUT':
        key = line[1]
        value = int(line[2])
        cache.put(key, value)
    elif operation == 'GET':
        key = line[1]
        result = cache.get(key)
        results.append(result)

if results:
    for result in results:
        print(result)
else:
    print('EMPTY')
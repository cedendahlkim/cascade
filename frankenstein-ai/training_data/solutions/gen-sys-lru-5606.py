# Task: gen-sys-lru-5606 | Score: 100% | 2026-02-17T19:56:19.040719

def lru_cache():
    capacity = int(input())
    n = int(input())
    cache = {}
    order = []
    results = []

    for _ in range(n):
        line = input().split()
        op = line[0]

        if op == 'PUT':
            key = line[1]
            value = line[2]

            if key in cache:
                cache[key] = value
                order.remove(key)
                order.append(key)
            else:
                if len(cache) == capacity:
                    lru_key = order.pop(0)
                    del cache[lru_key]
                cache[key] = value
                order.append(key)
        elif op == 'GET':
            key = line[1]
            if key in cache:
                results.append(cache[key])
                order.remove(key)
                order.append(key)
            else:
                results.append('-1')

    if not results:
        print('EMPTY')
    else:
        for result in results:
            print(result)

lru_cache()
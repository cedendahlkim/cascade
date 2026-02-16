# Task: gen-func-reduce_product-6292 | Score: 100% | 2026-02-14T12:08:03.181960

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
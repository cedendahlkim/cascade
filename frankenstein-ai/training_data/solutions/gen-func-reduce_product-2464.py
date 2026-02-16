# Task: gen-func-reduce_product-2464 | Score: 100% | 2026-02-13T12:40:59.859074

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
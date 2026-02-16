# Task: gen-func-reduce_product-5838 | Score: 100% | 2026-02-13T10:40:46.388391

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
# Task: gen-func-reduce_product-6333 | Score: 100% | 2026-02-13T13:03:17.082560

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
# Task: gen-func-reduce_product-6593 | Score: 100% | 2026-02-13T14:10:16.893951

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
# Task: gen-func-reduce_product-5910 | Score: 100% | 2026-02-15T09:35:11.326262

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
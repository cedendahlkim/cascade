# Task: gen-func-reduce_product-4994 | Score: 100% | 2026-02-13T18:20:29.379435

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
# Task: gen-func-reduce_product-2678 | Score: 100% | 2026-02-13T21:49:16.721353

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
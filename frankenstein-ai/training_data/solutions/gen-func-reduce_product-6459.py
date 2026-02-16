# Task: gen-func-reduce_product-6459 | Score: 100% | 2026-02-15T08:35:22.407099

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
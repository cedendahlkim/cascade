# Task: gen-func-reduce_product-3262 | Score: 100% | 2026-02-13T09:10:25.140701

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
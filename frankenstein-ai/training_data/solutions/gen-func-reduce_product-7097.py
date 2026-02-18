# Task: gen-func-reduce_product-7097 | Score: 100% | 2026-02-17T20:36:13.495397

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
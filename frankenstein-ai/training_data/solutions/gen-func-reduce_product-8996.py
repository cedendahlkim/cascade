# Task: gen-func-reduce_product-8996 | Score: 100% | 2026-02-13T19:14:12.213935

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
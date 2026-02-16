# Task: gen-func-reduce_product-1312 | Score: 100% | 2026-02-15T10:09:19.061907

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
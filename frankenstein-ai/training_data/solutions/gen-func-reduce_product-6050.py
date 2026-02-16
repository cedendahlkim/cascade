# Task: gen-func-reduce_product-6050 | Score: 100% | 2026-02-15T13:29:53.726160

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
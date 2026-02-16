# Task: gen-func-reduce_product-1090 | Score: 100% | 2026-02-13T13:42:18.765439

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
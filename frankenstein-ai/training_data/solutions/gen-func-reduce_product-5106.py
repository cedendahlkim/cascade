# Task: gen-func-reduce_product-5106 | Score: 100% | 2026-02-13T13:53:31.235492

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
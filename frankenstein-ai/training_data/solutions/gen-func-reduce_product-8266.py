# Task: gen-func-reduce_product-8266 | Score: 100% | 2026-02-15T11:36:55.675241

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
# Task: gen-func-reduce_product-2962 | Score: 100% | 2026-02-13T13:11:48.152008

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
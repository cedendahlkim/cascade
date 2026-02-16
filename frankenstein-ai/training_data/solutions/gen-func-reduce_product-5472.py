# Task: gen-func-reduce_product-5472 | Score: 100% | 2026-02-13T17:11:02.171254

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
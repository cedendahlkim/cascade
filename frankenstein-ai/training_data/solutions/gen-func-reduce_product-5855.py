# Task: gen-func-reduce_product-5855 | Score: 100% | 2026-02-13T12:51:57.876545

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)
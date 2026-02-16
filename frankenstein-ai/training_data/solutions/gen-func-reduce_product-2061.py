# Task: gen-func-reduce_product-2061 | Score: 100% | 2026-02-10T19:20:00.773600

def solve():
  n = int(input())
  product = 1
  for _ in range(n):
    num = int(input())
    product *= num
  print(product)

solve()
# Task: gen-list-count_negative-2947 | Score: 100% | 2026-02-13T17:11:28.239420

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
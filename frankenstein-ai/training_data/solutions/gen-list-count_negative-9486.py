# Task: gen-list-count_negative-9486 | Score: 100% | 2026-02-13T14:42:36.261134

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
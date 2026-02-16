# Task: gen-list-count_negative-9161 | Score: 100% | 2026-02-15T07:52:56.704031

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
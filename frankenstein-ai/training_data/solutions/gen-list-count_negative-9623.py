# Task: gen-list-count_negative-9623 | Score: 100% | 2026-02-15T09:02:36.242367

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
# Task: gen-list-count_negative-3921 | Score: 100% | 2026-02-15T09:51:30.429340

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
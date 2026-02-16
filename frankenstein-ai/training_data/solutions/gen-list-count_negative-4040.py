# Task: gen-list-count_negative-4040 | Score: 100% | 2026-02-15T08:14:58.296413

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
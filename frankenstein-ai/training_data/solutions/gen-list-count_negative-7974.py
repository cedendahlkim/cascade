# Task: gen-list-count_negative-7974 | Score: 100% | 2026-02-17T20:11:57.592331

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
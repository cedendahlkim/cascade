# Task: gen-list-count_negative-4861 | Score: 100% | 2026-02-15T12:03:30.889002

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
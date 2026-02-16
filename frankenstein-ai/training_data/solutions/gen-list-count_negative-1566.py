# Task: gen-list-count_negative-1566 | Score: 100% | 2026-02-13T12:23:17.892581

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
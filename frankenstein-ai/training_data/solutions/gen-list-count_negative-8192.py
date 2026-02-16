# Task: gen-list-count_negative-8192 | Score: 100% | 2026-02-13T12:44:03.638442

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
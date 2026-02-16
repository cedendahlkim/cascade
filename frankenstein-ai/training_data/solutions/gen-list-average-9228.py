# Task: gen-list-average-9228 | Score: 100% | 2026-02-15T09:01:45.442956

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
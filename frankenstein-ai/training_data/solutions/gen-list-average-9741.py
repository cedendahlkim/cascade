# Task: gen-list-average-9741 | Score: 100% | 2026-02-13T16:06:52.674538

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))
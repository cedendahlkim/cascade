# Task: gen-list-count_negative-9331 | Score: 100% | 2026-02-13T18:58:08.195040

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))
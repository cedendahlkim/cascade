# Task: gen-ll-reverse_list-9100 | Score: 100% | 2026-02-13T15:47:15.338532

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
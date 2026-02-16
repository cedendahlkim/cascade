# Task: gen-ll-reverse_list-2928 | Score: 100% | 2026-02-13T20:02:23.556217

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
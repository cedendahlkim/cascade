# Task: gen-ll-reverse_list-6215 | Score: 100% | 2026-02-13T18:23:09.677668

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
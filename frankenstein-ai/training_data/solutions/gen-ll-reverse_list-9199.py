# Task: gen-ll-reverse_list-9199 | Score: 100% | 2026-02-13T18:00:17.469119

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
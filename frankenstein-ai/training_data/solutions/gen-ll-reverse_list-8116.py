# Task: gen-ll-reverse_list-8116 | Score: 100% | 2026-02-13T13:10:31.339348

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
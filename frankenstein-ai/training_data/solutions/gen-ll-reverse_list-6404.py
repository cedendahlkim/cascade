# Task: gen-ll-reverse_list-6404 | Score: 100% | 2026-02-13T19:48:34.808794

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
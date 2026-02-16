# Task: gen-ll-reverse_list-4018 | Score: 100% | 2026-02-13T14:30:02.452170

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
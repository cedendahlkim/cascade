# Task: gen-ll-reverse_list-6679 | Score: 100% | 2026-02-13T17:35:58.904920

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
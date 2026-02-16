# Task: gen-ll-reverse_list-2777 | Score: 100% | 2026-02-15T13:31:00.899466

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
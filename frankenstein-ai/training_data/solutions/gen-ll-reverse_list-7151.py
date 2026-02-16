# Task: gen-ll-reverse_list-7151 | Score: 100% | 2026-02-13T12:27:08.282385

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
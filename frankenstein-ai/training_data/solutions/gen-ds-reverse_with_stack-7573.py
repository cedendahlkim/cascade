# Task: gen-ds-reverse_with_stack-7573 | Score: 100% | 2026-02-13T13:39:57.369520

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
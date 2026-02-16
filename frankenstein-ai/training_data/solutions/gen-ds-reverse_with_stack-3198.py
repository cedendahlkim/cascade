# Task: gen-ds-reverse_with_stack-3198 | Score: 100% | 2026-02-13T11:45:31.143087

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
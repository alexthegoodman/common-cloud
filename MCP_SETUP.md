# Video Project MCP Server Setup & Claude Code Integration

This guide will help you set up the MCP server for your video project management system and integrate it with Claude Code.

## 🛠️ Setup Instructions

### 1. Test the MCP Server

```bash
# Run the server locally to test
npx tsx mcp-server.ts
```

The server should output: `Video Project MCP Server running on stdio`

### 2. Make the Server Executable

```bash
chmod +x mcp-server.ts
```

## 🔗 Claude Code Integration

### Option 1: Global MCP Configuration

1. **Create or edit your Claude Code settings file**:

   - Location: `~/.config/claude-code/mcp_servers.json` (Linux/Mac) or `%APPDATA%\claude-code\mcp_servers.json` (Windows)

2. **Add your MCP server configuration**:

```json
{
  "mcpServers": {
    "video-project-server": {
      "command": "tsx",
      "args": ["/home/alext/projects/common/common-cloud/mcp/mcp-server.ts"],
      "env": {
        "DATABASE_URL": "your-postgresql-connection-string"
      }
    }
  }
}
```

### Option 2: Project-Specific Configuration

1. **Create a `.clauderc` file in your project root**:

```json
{
  "mcpServers": {
    "video-project-server": {
      "command": "tsx",
      "args": ["./mcp-server.ts"],
      "env": {
        "DATABASE_URL": "your-postgresql-connection-string"
      }
    }
  }
}
```

### Option 3: Using npx (Recommended)

1. **Make your server globally accessible by adding to package.json**:

```json
{
  "bin": {
    "video-project-mcp": "./mcp-server.ts"
  }
}
```

2. **Install globally**:

```bash
npm install -g .
```

3. **Configure Claude Code**:

```json
{
  "mcpServers": {
    "video-project-server": {
      "command": "video-project-mcp"
    }
  }
}
```

## 🚀 Usage Examples

Once integrated with Claude Code, you can use these commands:

### List User Projects

```
@video-project-server list_user_projects userId="user-123"
```

### Find Project by Name

```
@video-project-server get_project_by_name userId="user-123" projectName="My Video Project"
```

### Get Project Info

```
@video-project-server get_project_info projectId="project-456"
```

### Create a New Sequence

```
@video-project-server create_sequence projectId="project-456" name="Intro Sequence" durationMs=5000
```

### Add a Polygon

```
@video-project-server add_polygon projectId="project-456" sequenceId="seq-789" name="Red Rectangle" position='{"x": 100, "y": 100}' dimensions="[200, 150]" backgroundFill='{"Solid": [1, 0, 0, 1]}'
```

### Add Text

```
@video-project-server add_text projectId="project-456" sequenceId="seq-789" name="Title" text="Hello World!" position='{"x": 120, "y": 120}' dimensions="[160, 50]" fontSize=24
```

### Add Image

```
@video-project-server add_image projectId="project-456" sequenceId="seq-789" name="Logo" url="/path/to/logo.png" position='{"x": 50, "y": 50}' dimensions="[100, 100]"
```

### Add Video

```
@video-project-server add_video projectId="project-456" sequenceId="seq-789" name="Background Video" path="/path/to/video.mp4" position='{"x": 0, "y": 0}' dimensions="[1920, 1080]"
```

## 🔧 Troubleshooting

### Common Issues

1. **"Project not found" error**:

   - Verify the project ID exists in your database
   - Check that the user has permission to access the project

2. **"Sequence not found" error**:

   - Make sure the sequence exists in the project
   - Create a sequence first using `create_sequence`

3. **Database connection issues**:

   - Verify your `DATABASE_URL` is correct
   - Ensure your PostgreSQL server is running
   - Check that Prisma can connect: `npx prisma db push`

4. **MCP server not starting**:
   - Check that all dependencies are installed
   - Verify TypeScript compilation: `npx tsc --noEmit mcp-server.ts`

### Debugging

Enable verbose logging by setting environment variables:

```bash
export DEBUG=mcp:*
tsx mcp-server.ts
```

## 📚 API Reference

### Available Tools

| Tool                  | Description                       | Required Parameters                                                 |
| --------------------- | --------------------------------- | ------------------------------------------------------------------- |
| `list_user_projects`  | List all projects for a user      | `userId`                                                            |
| `get_project_by_name` | Find project by name              | `userId`, `projectName`                                             |
| `get_project_info`    | Get project details and sequences | `projectId`                                                         |
| `create_sequence`     | Create new sequence               | `projectId`, `name`                                                 |
| `add_polygon`         | Add polygon to sequence           | `projectId`, `sequenceId`, `name`, `position`, `dimensions`         |
| `add_text`            | Add text to sequence              | `projectId`, `sequenceId`, `name`, `text`, `position`, `dimensions` |
| `add_image`           | Add image to sequence             | `projectId`, `sequenceId`, `name`, `url`, `position`, `dimensions`  |
| `add_video`           | Add video to sequence             | `projectId`, `sequenceId`, `name`, `path`, `position`, `dimensions` |

### Data Types

- **Position**: `{"x": number, "y": number}`
- **Dimensions**: `[width, height]` (array of 2 numbers)
- **Color**: `[r, g, b, a]` (array of 4 numbers, 0-1 range)
- **BackgroundFill**: `{"Solid": [r, g, b, a]}` or `{"Gradient": {...}}`

## 🎯 Next Steps

Once set up, you can:

1. **Ask Claude Code to create video projects**: "Create a new video project with a title sequence"
2. **Add objects programmatically**: "Add a red rectangle and some text to this sequence"
3. **Batch operations**: "Add multiple objects to create a complete scene"
4. **Project management**: "List all my video projects and show me the sequences in each"

The MCP server integrates seamlessly with your existing editor state and database, so all changes will be reflected in your application immediately!
